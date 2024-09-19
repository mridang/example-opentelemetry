import type { AWS } from '@serverless/typescript';
import { AwsLambdaRuntime } from '@serverless/typescript';
import packageJson from './package.json';
import { secretName } from './src/constants';

const parentDomain = process.env.PARENT_DOMAIN;
const hostedZoneId = process.env.HOSTED_ZONE_ID;

if (parentDomain === undefined || hostedZoneId === undefined) {
  throw new Error('Environment variables not specified');
}

const fullDomainName = `${packageJson.name}.${parentDomain}`;

const serverlessConfiguration: AWS = {
  service: packageJson.name,
  frameworkVersion: '3',
  plugins: [
    'serverless-plugin-typescript',
    '@mridang/serverless-servestatic-plugin',
    '@mridang/serverless-checkov-plugin',
    '@mridang/serverless-shortsha-plugin',
    '@mridang/serverless-resourcetag-plugin',
    '@mridang/serverless-zipinfo-plugin',
  ],
  package: {
    individually: false,
    patterns: [
      'public/**/*',
      '**/*.hbs',
      '**/*.html',
      '!test',
      '!jest.config.js',
      '!jest.config.js.map',
      '!prettier.config.js',
      '!prettier.config.js.map',
      '!serverless.js',
      '!serverless.js.map',
      '!package.json',
    ],
  },
  provider: {
    stage: '${opt:stage, "dev"}',
    tags: {
      'sls:meta:project': packageJson.name,
      'sls:meta:repo': packageJson.repository.url,
      'sls:meta:environment': '${opt:stage, "dev"}',
    },
    environment: {
      NODE_OPTIONS: '--enable-source-maps',
      ACCOUNT_ID: '${aws:accountId}',
      NODE_ENV: '${self:provider.stage}',
      DOMAIN_NAME: fullDomainName,
      SERVICE_ID: packageJson.name,
      SERVICE_NAME: packageJson.name,
      SERVICE_TYPE: 'app',
      CLOUD_ACCOUNT_ID: '${aws:accountId}',
      CLOUD_AVAILABILITY_ZONE: '${aws:region}',
      CLOUD_PROVIDER: 'aws',
      CLOUD_REGION: '${aws:region}',
      CLOUD_SERVICE_NAME: 'lambda',
    },
    name: 'aws',
    deploymentMethod: 'direct',
    logRetentionInDays: 14,
    tracing: {
      lambda: true,
    },
    runtime: `nodejs${packageJson.engines.node}` as AwsLambdaRuntime,
    architecture: 'arm64',
    memorySize: 2048,
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: {
              'Fn::Join': [
                ':',
                [
                  'arn:aws:secretsmanager',
                  { Ref: 'AWS::Region' },
                  { Ref: 'AWS::AccountId' },
                  'secret',
                  `${secretName}-*`,
                ],
              ],
            },
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      ServeStaticBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: {
            Ref: 'ServeStaticAssetsBucket',
          },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 's3:GetObject',
                Principal: {
                  Service: 'cloudfront.amazonaws.com',
                },
                Effect: 'Allow',
                Resource: {
                  'Fn::Sub': '${ServeStaticAssetsBucket.Arn}/*',
                },
                Condition: {
                  StringEquals: {
                    'AWS:SourceArn': {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:cloudfront::',
                          { Ref: 'AWS::AccountId' },
                          ':distribution/',
                          { Ref: 'CloudFrontDistribution' },
                        ],
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      LambdaOriginAccessControl: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: `${packageJson.name}-\${self:provider.stage}-oac`,
            OriginAccessControlOriginType: 'lambda',
            SigningBehavior: 'always',
            SigningProtocol: 'sigv4',
          },
        },
      },
      SiteCertificate: {
        Type: 'AWS::CertificateManager::Certificate',
        Properties: {
          DomainName: fullDomainName,
          ValidationMethod: 'DNS',
        },
      },
      CloudFrontDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Enabled: true,
            PriceClass: 'PriceClass_All',
            HttpVersion: 'http2and3',
            IPV6Enabled: true,
            Origins: [
              {
                Id: 'LambdaOrigin',
                DomainName: {
                  'Fn::Select': [
                    2,
                    {
                      'Fn::Split': [
                        '/',
                        {
                          'Fn::GetAtt': [
                            'ProbotLambdaFunctionUrl',
                            'FunctionUrl',
                          ],
                        },
                      ],
                    },
                  ],
                },
                CustomOriginConfig: {
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'https-only',
                },
                OriginAccessControlId: {
                  Ref: 'LambdaOriginAccessControl',
                },
              },
              {
                Id: 'BucketOrigin',
                DomainName: {
                  'Fn::GetAtt': ['ServeStaticAssetsBucket', 'DomainName'],
                },
                S3OriginConfig: {
                  OriginAccessIdentity: '',
                },
                OriginAccessControlId: {
                  'Fn::GetAtt': ['ServeStaticAllowCloudfront', 'Id'],
                },
              },
            ],
            DefaultCacheBehavior: {
              TargetOriginId: 'LambdaOrigin',
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: [
                'GET',
                'HEAD',
                'OPTIONS',
                'PUT',
                'PATCH',
                'POST',
                'DELETE',
              ],
              CachedMethods: ['GET', 'HEAD'],
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
              OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
              Compress: true,
            },
            CacheBehaviors: [
              {
                PathPattern: '/static/*',
                TargetOriginId: 'BucketOrigin',
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                CachedMethods: ['GET', 'HEAD'],
                CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
                Compress: true,
              },
            ],
            Aliases: [fullDomainName],
            ViewerCertificate: {
              AcmCertificateArn: {
                Ref: 'SiteCertificate',
              },
              SslSupportMethod: 'sni-only',
              MinimumProtocolVersion: 'TLSv1.2_2021',
            },
          },
        },
      },
      DNSRecordForCloudFront: {
        Type: 'AWS::Route53::RecordSetGroup',
        Properties: {
          HostedZoneId: hostedZoneId,
          RecordSets: [
            {
              Name: fullDomainName,
              Type: 'A',
              SetIdentifier: 'Primary',
              AliasTarget: {
                HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront's Hosted Zone ID
                DNSName: {
                  'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
                },
                EvaluateTargetHealth: true,
              },
              Failover: 'PRIMARY',
            },
            {
              Name: fullDomainName,
              Type: 'AAAA',
              SetIdentifier: 'PrimaryIPv6',
              AliasTarget: {
                HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront's Hosted Zone ID
                DNSName: {
                  'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
                },
                EvaluateTargetHealth: true,
              },
              Failover: 'PRIMARY',
            },
          ],
        },
      },
      MySecretsManagerSecret: {
        Type: 'AWS::SecretsManager::Secret',
        Properties: {
          Name: secretName,
          Description: 'Secrets for my Github application',
          SecretString: JSON.stringify({
            SENTRY_DSN: '',
          }),
        },
      },
      ProbotLambdaPermissionFnUrl: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: {
            'Fn::GetAtt': ['ProbotLambdaFunction', 'Arn'],
          },
          Action: 'lambda:InvokeFunctionUrl',
          Principal: '*',
          FunctionUrlAuthType: 'NONE',
          SourceArn: {
            'Fn::Join': [
              '',
              [
                'arn:aws:cloudfront::',
                { Ref: 'AWS::AccountId' },
                ':distribution/',
                { Ref: 'CloudFrontDistribution' },
              ],
            ],
          },
        },
      },
    },
  },
  functions: {
    probot: {
      handler: 'src/lambda.handler',
      timeout: 60,
      url: true,
    },
  },
  custom: {
    servestatic: {
      include: ['public/**/*'],
      public: false,
    },
  },
};

module.exports = serverlessConfiguration;

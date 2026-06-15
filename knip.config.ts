export default {
  ignore: ['knip.config.ts', 'serverless.ts'],
  ignoreDependencies: [
    /^@semantic-release\//,
    /^@mridang\/serverless-.+-plugin$/,
    'preact',
  ],
};

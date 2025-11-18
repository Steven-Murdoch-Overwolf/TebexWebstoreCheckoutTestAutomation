export default {
  default: {
    require: ['./steps/**/*.js'],
    import: ['./steps/**/*.js'], // Add this line for Cucumber v9+
    format: ['progress', 'html:reports/cucumber-report.html'],
    paths: ['features/**/*.feature'],
    publishQuiet: true,
  },
};

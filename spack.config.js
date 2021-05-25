const { config } = require("@swc/core/spack");

module.exports = config({
  entry: {
    main: __dirname + "/js/main.ts",
  },
  output: {
    path: __dirname + "/build",
  },
});

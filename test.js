// Run Jest tests
const { execSync } = require("child_process");

try {
  execSync("jest --detectOpenHandles", { stdio: "inherit" });
} catch (error) {
  process.exit(1);
}
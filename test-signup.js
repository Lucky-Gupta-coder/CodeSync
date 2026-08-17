const axios = require("axios");

async function run() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/signup", {
      name: "CodeSync Test",
      email: `codesync_test_${Date.now()}@example.com`,
      password: "TestPassword123!",
    });
    console.log("Success:", res.status, res.data);
  } catch (error) {
    if (error.response) {
      console.log("Error status:", error.response.status);
      console.log("Error data:", error.response.data);
    } else {
      console.log("Network error:", error.message);
    }
  }
}

run();

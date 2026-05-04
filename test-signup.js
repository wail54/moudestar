const email = "test" + Date.now() + "@example.com";
fetch("http://localhost:3000/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: email, password: "password123" })
}).then(r => r.json()).then(console.log);

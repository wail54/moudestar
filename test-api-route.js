fetch("http://localhost:3000/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test" + Date.now() + "@example.com", password: "password123" })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});

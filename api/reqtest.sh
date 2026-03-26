curl -X POST "http://localhost:4200/api/v1/users/login" -H "Content-Type:application/json" -d '{"username":"notgian", "password":"password"}'

curl -X POST "http://localhost:4200/api/v1/users/follow/69c34c5634b7bb82aa0faae6" -H "Content-Type:application/json"

curl -X POST "http://localhost:4200/api/v1/users/follow/69c34c5634b7bb82aa0faae6" -H "Content-Type:application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWMzNGM2MDcxOTViOTZiNGUxNDIyY2IiLCJ1c2VybmFtZSI6Im5vdGdpYW4iLCJpYXQiOjE3NzQ1MjM2NzB9.FQXSzRf79KRtwTLPV4uBCm4UxCDl1pwYNTut8o3Zal0"

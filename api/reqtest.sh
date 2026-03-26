# Login
curl -X POST "http://localhost:4200/api/v1/auth/login" -H "Content-Type:application/json" -d '{"username":"notgian", "password":"password"}'

# Test: Follow
curl -X POST "http://localhost:4200/api/v1/users/follow/69c34c5634b7bb82aa0faae6" -H "Content-Type:application/json" -H "Authorization: Bearer "

# Test: Refresh Token
curl -X POST "http://localhost:4200/api/v1/auth/token" -H "Content-Type:application/json" -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWMzNGM2MDcxOTViOTZiNGUxNDIyY2IiLCJ1c2VybmFtZSI6Im5vdGdpYW4iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NDUzNzYyMCwiZXhwIjoxNzc3MTI5NjIwfQ.G8FHaSlphkJeojhmbqB_pZLi-U7UE-_JTb9xHKOcsmU"}'

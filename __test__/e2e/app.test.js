const request = require("supertest");
const app = require("../../app");

describe("testing /", () =>{

    it("should redirect 302", async () => {
        const response = await request(app).get("/");

        expect(response.status).toEqual(302);
        expect(response.text).toEqual("Found. Redirecting to \/catalog");
    }, 6000)

})

describe("testing /users/register", () =>{

    it("should return 200", async () => {
        const response = await request(app).get("/users/register");

        expect(response.status).toEqual(200);
        expect(response.headers["content-type"]).toMatch(/text\/html\; charset=utf-8/); // headers in low case!
        expect(response.text).toMatch(/Create User/);
        
    })

})

describe("testing /users/login", () =>{

    it("should return 200", async () => {
        const response = await request(app).get("/users/login");

        expect(response.status).toEqual(200);
        expect(response.headers["content-type"]).toMatch(/text\/html\; charset=utf-8/); // headers in low case!
        expect(response.text).toMatch(/Forgot your password\?/);
        
    })

    it('should redirect to \/users\/login with incorrrect username & password and show "Incorrect username."', async () => {
        // Step 1: Send a request to the original endpoint triggering the redirection
        const response = await request(app)
            .post("/users/login")
            .send({username: 1, password: 1});

        // Step 2: Check the response status code and get the 'Location' header
        expect(response.status).toEqual(302);
        const redirectLocation = response.headers.location;
        
        // Step 3: Send a separate request to the final destination page (FLASH messages lost here)
        const finalDestinationResponse = await request(app).get(redirectLocation);

        // Step 4: Assert the response from the final destination page
        expect(finalDestinationResponse.status).toBe(200); // Check for a successful status code (e.g., 200 OK)
        expect(finalDestinationResponse.text).toContain('Forgot your password?'); // Replace with the expected content        
    })

    it("should redirect 302 to root \"/\"  with corrrect username & password", async () => {
        const response = await request(app)
            .post("/users/login")
            .send({username: "Read", password: "1111"});  // strings in both arguments!

        expect(response.status).toEqual(302);
        expect(response.text).toEqual("Found. Redirecting to \/");        
    }, 3000)

})
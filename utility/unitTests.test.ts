import test from "node:test";

let temp = 0;

afterEach(() => {
    console.log(temp);
    temp += 1;
});

test("test", () => {
    console.log("hi");
    expect(6).toBe(4);
});

test("test", () => {
    console.log("hi2");
    expect(6).toBe(6);
});

test("test", () => {
    console.log("hi2");
    expect(6).toBe(6);
});

test("test", () => {
    console.log("hi2");
    expect(6).toBe(6);
});

describe("Tests passed:", () => {
    console.log(temp);
});

// Mock @google-cloud/storage
jest.mock('@google-cloud/storage', () => {
  const mStorage = {
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        download: jest.fn(() => Promise.resolve()), // Mock download method
        save: jest.fn(() => Promise.resolve()),    // Mock save method
      })),
    })),
  };
  return { Storage: jest.fn(() => mStorage) };
});

const { imageResizer } = require("../index");

describe("imageResizer", () => {
  it("should be a function", () => {
    expect(typeof imageResizer).toBe("function");
  });

  it("should process an image without errors", async () => {
    const event = {
      bucket: "upload-bucket-experiment",
      name: "test-image.jpg",
    };
    await expect(imageResizer(event)).resolves.toBeUndefined();
  });
});


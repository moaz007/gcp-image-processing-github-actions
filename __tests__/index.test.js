jest.mock('@google-cloud/storage', () => {
  const mStorage = {
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        download: jest.fn(() => Promise.resolve()),
        save: jest.fn(() => Promise.resolve()),
      })),
    })),
  };
  return { Storage: jest.fn(() => mStorage) };
});

const { "image-resizer": imageResizer } = require("../index");

describe("image-resizer", () => {
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


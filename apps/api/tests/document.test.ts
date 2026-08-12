import mongoose from "mongoose";
import { DocumentModel } from "../src/modules/document/document.model.js";
import { documentService } from "../src/realtime/services/document.service.js";
import { Room } from "../src/modules/room/room.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import * as Y from "yjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

describe("Document Service and Persistence", () => {
  jest.setTimeout(30000); // 30 seconds

  let mongoServer: MongoMemoryServer;
  let workspaceId: mongoose.Types.ObjectId;
  let roomId: mongoose.Types.ObjectId;
  const fileId = "test-file-1";

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await DocumentModel.deleteMany({});
    await Room.deleteMany({});
    await Workspace.deleteMany({});

    const workspace = await Workspace.create({
      name: "Test Workspace",
      slug: "test-workspace",
      owner: new mongoose.Types.ObjectId(),
    });
    workspaceId = workspace._id;

    const room = await Room.create({
      name: "Test Room",
      workspace: workspaceId,
      owner: new mongoose.Types.ObjectId(),
      language: "typescript",
    });
    roomId = room._id;
  });

  it("should create a new document in the database if it doesn't exist", async () => {
    const doc = await documentService.getDocument(roomId.toString(), fileId);
    expect(doc).toBeDefined();

    const savedDoc = await DocumentModel.findOne({ room: roomId, fileId });
    expect(savedDoc).toBeDefined();
    expect(savedDoc?.workspace.toString()).toEqual(workspaceId.toString());
    expect(savedDoc?.state).toBeDefined();
  });

  it("should apply an update and debounce save to database", async () => {
    const doc = await documentService.getDocument(roomId.toString(), fileId);

    // Create an update
    const ytext = doc.getText("monaco");
    ytext.insert(0, "hello world");
    const update = Y.encodeStateAsUpdate(doc);

    await documentService.applyUpdate(roomId.toString(), fileId, update.buffer as ArrayBuffer);

    // Should not be saved immediately
    const savedDocBefore = await DocumentModel.findOne({ room: roomId, fileId });
    const decodedBefore = new Y.Doc();
    Y.applyUpdate(decodedBefore, new Uint8Array(savedDocBefore!.state));
    expect(decodedBefore.getText("monaco").toString()).not.toEqual("hello world");

    // Wait for the debounce timeout
    await new Promise((resolve) => setTimeout(resolve, 5100));

    const savedDocAfter = await DocumentModel.findOne({ room: roomId, fileId });
    const decodedAfter = new Y.Doc();
    Y.applyUpdate(decodedAfter, new Uint8Array(savedDocAfter!.state));
    expect(decodedAfter.getText("monaco").toString()).toEqual("hello world");
  }, 10000);

  it("should clean up room and force save", async () => {
    const doc = await documentService.getDocument(roomId.toString(), fileId);
    const ytext = doc.getText("monaco");
    ytext.insert(0, "test cleanup");
    const update = Y.encodeStateAsUpdate(doc);

    await documentService.applyUpdate(roomId.toString(), fileId, update.buffer as ArrayBuffer);

    // Call cleanup
    await documentService.cleanupRoom(roomId.toString());

    const savedDoc = await DocumentModel.findOne({ room: roomId, fileId });
    const decoded = new Y.Doc();
    Y.applyUpdate(decoded, new Uint8Array(savedDoc!.state));
    expect(decoded.getText("monaco").toString()).toEqual("test cleanup");
  });
});

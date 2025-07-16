"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const db_1 = require("../db");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, db_1.openDb)();
        // Read the schema file from the correct path
        const schemaPath = path_1.default.join(__dirname, '../../database/schema.sql');
        const schema = yield promises_1.default.readFile(schemaPath, 'utf-8');
        // Execute the schema to create all tables
        yield db.exec(schema);
        console.log('Database initialized successfully with all tables');
        // Enable foreign key constraints
        yield db.exec('PRAGMA foreign_keys = ON;');
        yield db.close();
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
});
exports.initializeDatabase = initializeDatabase;

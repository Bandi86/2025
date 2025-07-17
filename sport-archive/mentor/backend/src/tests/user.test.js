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
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/api/users';
const testUser = {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'password123'
};
let userId;
const runTests = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create User
        const createUserResponse = yield axios_1.default.post(API_URL, testUser);
        userId = createUserResponse.data.id;
        console.log('CREATE USER:', createUserResponse.data);
        // Get Users
        const getUsersResponse = yield axios_1.default.get(API_URL);
        console.log('GET USERS:', getUsersResponse.data);
        // Get User
        const getUserResponse = yield axios_1.default.get(`${API_URL}/${userId}`);
        console.log('GET USER:', getUserResponse.data);
        // Update User
        const updatedUser = Object.assign(Object.assign({}, testUser), { name: 'Updated Test User' });
        const updateUserResponse = yield axios_1.default.put(`${API_URL}/${userId}`, updatedUser);
        console.log('UPDATE USER:', updateUserResponse.data);
        // Delete User
        const deleteUserResponse = yield axios_1.default.delete(`${API_URL}/${userId}`);
        console.log('DELETE USER:', deleteUserResponse.data);
    }
    catch (error) {
        console.error('TEST FAILED:', error);
    }
});
runTests();

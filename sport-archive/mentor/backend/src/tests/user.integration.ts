import axios from 'axios';

const API_URL = 'http://localhost:3000/api/users';

const testUser = {
  name: 'Test User',
  email: 'test.user@example.com',
  password: 'password123'
};

let userId: number;

const runTests = async () => {
  try {
    // Create User
    const createUserResponse = await axios.post(API_URL, testUser);
    userId = createUserResponse.data.id;
    console.log('CREATE USER:', createUserResponse.data);

    // Get Users
    const getUsersResponse = await axios.get(API_URL);
    console.log('GET USERS:', getUsersResponse.data);

    // Get User
    const getUserResponse = await axios.get(`${API_URL}/${userId}`);
    console.log('GET USER:', getUserResponse.data);

    // Update User
    const updatedUser = { ...testUser, name: 'Updated Test User' };
    const updateUserResponse = await axios.put(`${API_URL}/${userId}`, updatedUser);
    console.log('UPDATE USER:', updateUserResponse.data);

    // Delete User
    const deleteUserResponse = await axios.delete(`${API_URL}/${userId}`);
    console.log('DELETE USER:', deleteUserResponse.data);

  } catch (error) {
    console.error('TEST FAILED:', error);
  }
};

runTests();

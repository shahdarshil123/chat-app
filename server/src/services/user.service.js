import { checkUserExistsByEmail, checkUserExistsByUsername, createUser, getUserById, updateUserLastSeen, getLastSeen, searchUsers, getUserByEmail, getUserByUsername } from '../db/users.js';

export async function getUserByIdService(userId) {
    if (!userId) return;

    const user = await getUserById(userId);

    if (!user) return;

    return user;
};

export async function getUserByEmailService(emailId){
    if(!emailId) return;

    const user = await getUserByEmail(emailId);

    if(!user) return;

    return user;
}

export async function getUserByUsernameService(username){
    if(!username) return;

    const user = await getUserByUsername(username);

    if(!user) return;

    return user;
}

export async function createUserService(username, email, password, displayName) {

    const emailCheck = await checkUserExistsByEmail(email);

    if (emailCheck) return;

    const usernameCheck = await checkUserExistsByUsername(username);

    if (usernameCheck) return;

    const data = {
        username, email, password, displayName
    };

    const user = await createUser(data);

    if (!user) return;

    return user;
};

export async function updateUserLastSeenService(userId) {

    if (!userId) return;

    const updated = await updateUserLastSeen(userId);

    return updated;
};

export async function getLastSeenService(userId) {

    if (!userId) return;

    const user = await getLastSeen(userId);

    if (!user) return;

    return user;
};

export async function searchUsersService({
    query,
    currentUserId,
    limit = 10,
}) {
    if (!query || !query.trim()) return [];

    const users = await searchUsers(currentUserId, query, limit);

    return users;
}
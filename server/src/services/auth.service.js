import express from 'express';
import { getUserByEmail, verifyPassword, updateUserLastSeen } from '../db/users.js';

export async function userLoginService(email, password){
    if(!email || !password) return;

    const user = await getUserByEmail(email);
    if (!user) return;

    const valid = await verifyPassword(user, password);
    if (!valid) return;

    // Update status to online
    await updateUserLastSeen(user.id);

    return user;
};

export async function userLogoutService(){

};



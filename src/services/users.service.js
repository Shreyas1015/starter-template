import logger from '#config/logger.js';
import User from '#models/user.model.js';

export const getAllUsers = async () => {
  try {
    return await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
    });
  } catch (e) {
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (e) {
    logger.error(`Error getting user by id ${id}:`, e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // First check if user exists
    const existingUser = await getUserById(id);

    // Check if email is being updated and if it already exists
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await User.findOne({
        where: { email: updates.email },
      });
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Update the user
    await existingUser.update(updates);

    logger.info(`User ${existingUser.email} updated successfully`);

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
      created_at: existingUser.created_at,
      updated_at: existingUser.updated_at,
    };
  } catch (e) {
    logger.error(`Error updating user ${id}:`, e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    // First check if user exists
    const user = await getUserById(id);

    // Delete the user
    await user.destroy();

    logger.info(`User ${user.email} deleted successfully`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (e) {
    logger.error(`Error deleting user ${id}:`, e);
    throw e;
  }
};

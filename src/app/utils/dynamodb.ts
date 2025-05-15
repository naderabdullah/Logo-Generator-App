// src/utils/dynamodb.ts
import { DynamoDB } from 'aws-sdk';

// Initialize DynamoDB client with credentials from environment variables
const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Table names for our application
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'users',
  LOGOS: process.env.DYNAMODB_LOGOS_TABLE || 'logos',
  REFRESH_TOKENS: process.env.DYNAMODB_REFRESH_TOKENS_TABLE || 'refresh_tokens',
};

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  const params = {
    TableName: TABLES.USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email.toLowerCase(),
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string) {
  const params = {
    TableName: TABLES.USERS,
    Key: {
      id: userId,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(user: any) {
  const params = {
    TableName: TABLES.USERS,
    Item: user,
    ConditionExpression: 'attribute_not_exists(id)',
  };

  try {
    await dynamoDb.put(params).promise();
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(userId: string, updates: any) {
  // Build the update expression and attribute values dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id') {
      // Skip the primary key
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const params = {
    TableName: TABLES.USERS,
    Key: {
      id: userId,
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };

  try {
    const result = await dynamoDb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Save a logo for a user
 */
export async function saveLogo(logo: any) {
  const params = {
    TableName: TABLES.LOGOS,
    Item: logo,
    ConditionExpression: 'attribute_not_exists(id)',
  };

  try {
    await dynamoDb.put(params).promise();
    return logo;
  } catch (error) {
    console.error('Error saving logo:', error);
    throw error;
  }
}

/**
 * Get a logo by ID
 */
export async function getLogoById(logoId: string) {
  const params = {
    TableName: TABLES.LOGOS,
    Key: {
      id: logoId,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('Error getting logo by ID:', error);
    throw error;
  }
}

/**
 * Get all logos for a user
 */
export async function getLogosByUserId(userId: string) {
  const params = {
    TableName: TABLES.LOGOS,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error getting logos by user ID:', error);
    throw error;
  }
}

/**
 * Update a logo
 */
export async function updateLogo(logoId: string, updates: any) {
  // Build the update expression and attribute values dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id') {
      // Skip the primary key
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const params = {
    TableName: TABLES.LOGOS,
    Key: {
      id: logoId,
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };

  try {
    const result = await dynamoDb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('Error updating logo:', error);
    throw error;
  }
}

// Count revisions for a specific original logo
export async function countRevisionsForLogo(originalLogoId: string): Promise<number> {
  try {
    const params = {
      TableName: TABLES.LOGOS,
      IndexName: 'originalLogoId-index',
      KeyConditionExpression: 'originalLogoId = :originalId',
      ExpressionAttributeValues: {
        ':originalId': originalLogoId
      }
    };

    const result = await dynamoDb.query(params).promise();
    return result.Items ? result.Items.length : 0;
  } catch (error) {
    console.error('Error counting revisions for logo:', error);
    throw error;
  }
}

/**
 * Delete a logo
 */
export async function deleteLogo(logoId: string) {
  const params = {
    TableName: TABLES.LOGOS,
    Key: {
      id: logoId,
    },
  };

  try {
    await dynamoDb.delete(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
}

/**
 * Store a refresh token
 */
export async function storeRefreshToken(tokenData: any) {
  const params = {
    TableName: TABLES.REFRESH_TOKENS,
    Item: tokenData,
  };

  try {
    await dynamoDb.put(params).promise();
    return tokenData;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
}

/**
 * Get refresh token data
 */
export async function getRefreshToken(token: string) {
  const params = {
    TableName: TABLES.REFRESH_TOKENS,
    Key: {
      token,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    throw error;
  }
}

/**
 * Delete a refresh token
 */
export async function deleteRefreshToken(token: string) {
  const params = {
    TableName: TABLES.REFRESH_TOKENS,
    Key: {
      token,
    },
  };

  try {
    await dynamoDb.delete(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    throw error;
  }
}

/**
 * Delete all refresh tokens for a user
 */
export async function deleteUserRefreshTokens(userId: string) {
  const params = {
    TableName: TABLES.REFRESH_TOKENS,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    const tokens = result.Items || [];

    // Delete each token
    for (const tokenData of tokens) {
      await deleteRefreshToken(tokenData.token);
    }

    return true;
  } catch (error) {
    console.error('Error deleting user refresh tokens:', error);
    throw error;
  }
}

export default dynamoDb;
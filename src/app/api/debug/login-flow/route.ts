// 1. ADD TO: /api/auth/dynamo-login/route.ts - Simple version
export async function POST(request: NextRequest) {
    try {
        console.log('🚀 === DYNAMO LOGIN START ===');

        const body = await request.json();
        const { email, password } = body;
        console.log('📧 Login attempt for:', email);

        // Find user
        const result = await dynamoDB.scan({
            TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email.toLowerCase() }
        }).promise();

        if (!result.Items || result.Items.length === 0) {
            console.log('❌ User not found:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.Items[0];
        const userStatus = user.Status || user.status;

        console.log('✅ User found:');
        console.log('   - ID:', user.id);
        console.log('   - Email:', user.email);
        console.log('   - Status field:', user.Status);
        console.log('   - status field:', user.status);
        console.log('   - Final status:', userStatus);

        // STATUS CHECK - This is the critical part
        console.log('🎯 === STATUS CHECK ===');
        console.log('   - userStatus:', userStatus);
        console.log('   - userStatus === "active":', userStatus === 'active');
        console.log('   - userStatus === "pending":', userStatus === 'pending');
        console.log('   - Will reject (userStatus !== "active"):', userStatus !== 'active');

        if (userStatus !== 'active') {
            console.log('🛑 REJECTING USER - Status is not active:', userStatus);

            if (userStatus === 'inactive') {
                console.log('🛑 Returning inactive account error');
                return NextResponse.json({
                    error: 'This account has been deactivated. Please contact support if you need to reactivate your account.'
                }, { status: 403 });
            } else {
                console.log('🛑 Returning account not active error');
                return NextResponse.json({
                    error: 'Account is not active. Please contact support to activate your account.'
                }, { status: 403 });
            }
        }

        console.log('✅ Status check PASSED - user is active');

        // Password check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        console.log('✅ Password check PASSED');
        console.log('🎉 === LOGIN SUCCESS ===');

        // Generate token
        const token = generateToken(user.id, user.email);
        console.log('🔐 Generated token for user ID:', user.id);

        // ... rest of your existing code for setting cookie and response

    } catch (error: any) {
        console.error('💥 === DYNAMO LOGIN ERROR ===', error);
        // ... error handling
    }
}

// 2. ADD TO: /api/user/route.ts - Simple version
export async function GET(request: NextRequest) {
    try {
        console.log('🚀 === /api/user ENDPOINT CALLED ===');

        const user = await getCurrentUser(request);

        console.log('🔍 getCurrentUser result type:', typeof user);
        console.log('🔍 getCurrentUser result value:', user === null ? 'null' :
            user === 'not_allowed' ? 'not_allowed' : 'user object');

        if (!user) {
            console.log('❌ No user - returning 401');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user === 'not_allowed') {
            console.log('❌ User not allowed - returning 401');
            return NextResponse.json({ error: 'Account not active' }, { status: 401 });
        }

        console.log('✅ User data found:');
        console.log('   - Email:', user.email);
        console.log('   - Status:', user.status);
        console.log('   - Is superuser:', user.isSuperUser);
        console.log('   - Logo limit:', user.logosLimit);

        const response = formatUserResponse(user);
        console.log('📤 Returning response:', response);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('💥 /api/user ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}

// 3. ADD TO: lib/auth-utils.ts - getCurrentUser function - Simple version
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null | 'not_allowed'> {
    try {
        console.log('🚀 === getCurrentUser CALLED ===');

        // Get token
        const accessToken = request.cookies.get('access_token')?.value;
        if (!accessToken) {
            console.log('❌ No access token');
            return null;
        }
        console.log('✅ Access token found');

        // Verify token
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret') as { id: number, email: string };
        console.log('🔐 Token decoded - User ID:', decoded.id, 'Email:', decoded.email);

        // Get user from DB
        const dynamoResult = await dynamoDB.get({
            TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
            Key: { id: decoded.id }
        }).promise();

        if (!dynamoResult.Item) {
            console.log('❌ User not found in DB for ID:', decoded.id);
            return null;
        }

        const user = dynamoResult.Item;
        const userStatus = user.Status || user.status;
        const email = user.email;

        console.log('✅ User found in getCurrentUser:');
        console.log('   - ID:', user.id);
        console.log('   - Email:', email);
        console.log('   - Status:', userStatus);

        // Superuser check
        const superUserStatus = getSuperUserStatus(email);
        console.log('👑 Superuser check - Is superuser:', superUserStatus.isSuperUser);

        if (superUserStatus.isSuperUser) {
            console.log('👑 SUPERUSER BYPASS - Allowing regardless of status');
            // Return superuser data (rest of your existing superuser logic)
            return {
                id: user.id,
                email: email,
                logosCreated: 0, // simplified for debug
                logosLimit: 999999,
                status: userStatus,
                isSuperUser: true,
                superUserPrivilege: superUserStatus.privilege
            };
        }

        // Regular status check
        console.log('🎯 === REGULAR USER STATUS CHECK ===');
        console.log('   - userStatus:', userStatus);
        console.log('   - userStatus !== "active":', userStatus !== 'active');
        console.log('   - userStatus !== "pending":', userStatus !== 'pending');
        console.log('   - Both conditions (would reject):', userStatus !== 'active' && userStatus !== 'pending');

        if (userStatus !== 'active' && userStatus !== 'pending') {
            console.log('🛑 REJECTING in getCurrentUser - Status not allowed:', userStatus);
            return 'not_allowed';
        }

        console.log('✅ getCurrentUser status check PASSED');

        // Return user data (simplified for debug)
        return {
            id: user.id,
            email: email,
            logosCreated: 0, // Get from Supabase in real implementation
            logosLimit: 5,   // Get from Supabase in real implementation
            status: userStatus,
            isSuperUser: false
        };

    } catch (error: any) {
        console.error('💥 getCurrentUser ERROR:', error);
        return null;
    }
}
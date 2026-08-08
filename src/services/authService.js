import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp,
} from 'aws-amplify/auth';

export const authService = {
  async register({ username, displayName, email, password }) {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          preferred_username: username,
          name: displayName,
        },
      },
    });

    return {
      ...result,
      email,
      username,
      displayName,
    };
  },

  async login({ identifier, password }) {
    const result = await signIn({
      username: identifier,
      password,
    });

    if (!result.isSignedIn) {
      return result;
    }

    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      user: {
        id: currentUser.userId,
        email: attributes.email,
        username: attributes.preferred_username,
        displayName: attributes.name,
      },
    };
  },

  async logout() {
    await signOut();
  },

  async me() {
    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      user: {
        id: currentUser.userId,
        email: attributes.email,
        username: attributes.preferred_username,
        displayName: attributes.name,
      },
    };
  },
  async confirmRegistration(email, code) {
  return confirmSignUp({
    username: email,
    confirmationCode: code,
  });
},
};
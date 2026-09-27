import { Role } from "../../../../generated/prisma/client";
import { auth } from "../../lib/auth";

interface IRegisterPatientPayload {
  name: string;
  email: string;
  password: string;
}

interface ILoginPatientPayload {
  email: string;
  password: string;
}

const registerPatient = async (payload: IRegisterPatientPayload) => {
  const { name, email, password } = payload;
  const createUser = await auth.api.signUpEmail({
    body: { name, email, password, role: Role.PATIENT },
  });

  if (!createUser.user) {
    throw new Error("Failed to create new user");
  }

  return createUser;
};

const loginUser = async (payload: ILoginPatientPayload) => {
  const { email, password } = payload;

  const getUser = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  return getUser;
};

export const AuthServices = { registerPatient, loginUser };

import { Specialty } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  const data = await prisma.specialty.create({ data: payload });

  return data;
};

const getAllSpecialty = async (): Promise<Specialty[]> => {
  const data = await prisma.specialty.findMany({
    where: { isDeleted: false },
  });

  return data;
};

const getSingleSpecialty = async (id: string): Promise<Specialty | null> => {
  const data = await prisma.specialty.findFirst({
    where: { id, isDeleted: false },
  });

  return data;
};

const updateSpecialty = async (
  id: string,
  payload: Partial<Specialty>,
): Promise<Specialty | null> => {
  const isExist = await prisma.specialty.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isExist) {
    return null;
  }

  const data = await prisma.specialty.update({
    where: { id },
    data: payload,
  });

  return data;
};

const deleteSpecialty = async (id: string): Promise<Specialty | null> => {
  const isExist = await prisma.specialty.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isExist) {
    return null;
  }

  const data = await prisma.specialty.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return data;
};

export const specialtyServices = {
  createSpecialty,
  getAllSpecialty,
  getSingleSpecialty,
  updateSpecialty,
  deleteSpecialty,
};

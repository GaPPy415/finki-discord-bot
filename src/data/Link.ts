import { logger } from "../utils/logger.js";
import { database } from "./database.js";
import { type Link, type Prisma } from "@prisma/client";

export const getLinks = async () => {
  try {
    return await database.link.findMany();
  } catch (error) {
    logger.error(`Failed obtaining links\n${error}`);
    return [];
  }
};

export const getLinkNames = async () => {
  try {
    return await database.link.findMany({
      select: {
        name: true,
      },
    });
  } catch (error) {
    logger.error(`Failed obtaining link names\n${error}`);
    return [];
  }
};

export const getLink = async (name?: string) => {
  if (name === undefined) {
    return null;
  }

  try {
    return await database.link.findFirst({
      where: {
        name,
      },
    });
  } catch (error) {
    logger.error(`Failed obtaining link\n${error}`);
    return null;
  }
};

export const createLink = async (link?: Prisma.LinkCreateInput) => {
  if (link === undefined) {
    return null;
  }

  try {
    return await database.link.create({
      data: link,
    });
  } catch (error) {
    logger.error(`Failed creating link\n${error}`);
    return null;
  }
};

export const updateLink = async (link?: Link) => {
  if (link === undefined) {
    return null;
  }

  try {
    return await database.link.update({
      data: link,
      where: {
        name: link.name,
      },
    });
  } catch (error) {
    logger.error(`Failed updating link\n${error}`);
    return null;
  }
};

export const deleteLink = async (name?: string) => {
  if (name === undefined) {
    return null;
  }

  try {
    return await database.link.delete({
      where: {
        name,
      },
    });
  } catch (error) {
    logger.error(`Failed deleting link\n${error}`);
    return null;
  }
};
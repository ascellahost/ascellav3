import { D1Orm, DataTypes, Model } from "d1-orm";
import { UploadLimits } from "ascella-common";
export type User = {
  email: string;
  name: string;
  domain: string;
  token: string;
  uuid: string;
  id: number;
  upload_limit: UploadLimits;
};
export type Domain = {
  id: number;
  domain: string;
  apex: 0 | 1;
  official: 0 | 1;
  private?: string;
};
export type File = {
  id: number;
  name: string;
  size: number;
  type: string;
  vanity: string;
  upload_name: string;
  uploader?: number;
};
export type Review = {
  id: number;
  name: string;
  avatar: string;
  comment: string;
};
export function getOrm(db: D1Database) {
  const orm = new D1Orm(db);
  const users = new Model<User>(
    {
      D1Orm: orm,
      tableName: "users",
    },
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
      },
      name: {
        type: DataTypes.STRING,
        notNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        notNull: true,
      },
      token: {
        type: DataTypes.STRING,
        notNull: true,
      },
      uuid: {
        type: DataTypes.STRING,
        unique: true,
        notNull: true,
      },
      domain: {
        type: DataTypes.STRING,
        notNull: true,
      },
      upload_limit: {
        type: DataTypes.INTEGER,
        notNull: true,
        defaultValue: UploadLimits.User,
      },
    },
  );
  const domains = new Model<Domain>(
    {
      D1Orm: orm,
      tableName: "domains",
    },
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
      },
      domain: {
        type: DataTypes.STRING,
        notNull: true,
        unique: true,
      },
      apex: {
        type: DataTypes.INT,
        notNull: true,
        defaultValue: 1,
      },
      official: {
        type: DataTypes.INT,
        notNull: true,
        defaultValue: 0,
      },
      private: {
        type: DataTypes.STRING,
        notNull: false,
      },
    },
  );
  const files = new Model<File>(
    {
      D1Orm: orm,
      tableName: "files",
    },
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
      },
      name: {
        type: DataTypes.STRING,
        notNull: true,
      },
      size: {
        type: DataTypes.INTEGER,
        notNull: true,
      },
      type: {
        type: DataTypes.STRING,
        notNull: true,
      },
      vanity: {
        type: DataTypes.STRING,
        notNull: true,
        unique: true,
      },
      upload_name: {
        type: DataTypes.STRING,
        notNull: true,
      },
      uploader: {
        type: DataTypes.INTEGER,
        notNull: false,
      },
    },
  );
  const reviews = new Model<Review>({
    D1Orm: orm,
    tableName: "reviews",
  }, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      notNull: true,
    },
    name: {
      type: DataTypes.STRING,
      notNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      notNull: true,
    },
    comment: {
      type: DataTypes.STRING,
      notNull: true,
    },
  });

  return [orm, { users, domains, files, reviews }] as const;
}

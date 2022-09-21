export type AscellaErrorResponse = {
  code: number;
  message: string;
  success: boolean;
  donate: string;
};
export type StatsResponse = {
  users: number;
  files: number;
  domains: number;
  views: number;
  storageUsage: number;
  redirects: number;
};
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
export enum UploadLimits {
  Guest = 1024 * 1024 * 5,
  User = 1024 * 1024 * 10,
  Premium = 1024 * 1024 * 100,
  Admin = 1024 * 1024 * 512,
}
export enum Styles {
  default = 1,
  uuid = 2,
  zws = 3,
  ulid = 4,
  emoji = 5,
  filename = 6,
}

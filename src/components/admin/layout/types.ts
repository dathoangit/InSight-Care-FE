export type AdminLayoutBed = {
  id: string;
  name: string;
  opensOn: string;
  closesOn: string | null;
  isClosed: boolean;
};

export type AdminLayoutRoom = {
  id: string;
  name: string;
  beds: AdminLayoutBed[];
};

export type AdminLayoutFloor = {
  floor: string;
  rooms: AdminLayoutRoom[];
};

export type CreateAdminBedBody = {
  roomId: string;
  name: string;
};

export type UpdateAdminBedBody = {
  name: string;
};

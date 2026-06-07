export type LayoutBed = {
  id: string;
  name: string;
};

export type LayoutRoom = {
  id: string;
  name: string;
  beds: LayoutBed[];
};

export type LayoutFloor = {
  floor: number;
  rooms: LayoutRoom[];
};

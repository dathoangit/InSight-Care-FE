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

/** Bed with room/floor context, flattened from layout tree */
export type FlatLayoutBed = {
  bedId: string;
  bedName: string;
  roomId: string;
  roomName: string;
  floor: number;
};

import { type FlatLayoutBed, type LayoutFloor } from './types';

export function flattenLayout(floors: LayoutFloor[]): FlatLayoutBed[] {
  return floors.flatMap((floor) =>
    floor.rooms.flatMap((room) =>
      room.beds.map((bed) => ({
        bedId: bed.id,
        bedName: bed.name,
        roomId: room.id,
        roomName: room.name,
        floor: floor.floor,
      })),
    ),
  );
}

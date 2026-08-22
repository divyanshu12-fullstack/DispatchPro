import Area from '../models/Area.js';
import { ApiError } from '../utils/ApiError.js';

export async function findZoneByPincode(pincode) {
  const area = await Area.findOne({ pincode, isServiceable: true });
  if (!area) {
    throw ApiError.unprocessable(`Pincode ${pincode} is not serviceable`);
  }
  return area.zoneId;
}

export async function arePincodesSameZone(pickupPincode, dropPincode) {
  const [pickupArea, dropArea] = await Promise.all([
    Area.findOne({ pincode: pickupPincode, isServiceable: true }),
    Area.findOne({ pincode: dropPincode, isServiceable: true }),
  ]);

  if (!pickupArea) throw ApiError.unprocessable(`Pincode ${pickupPincode} is not serviceable`);
  if (!dropArea) throw ApiError.unprocessable(`Pincode ${dropPincode} is not serviceable`);

  return {
    pickupZoneId: pickupArea.zoneId,
    dropZoneId: dropArea.zoneId,
    sameZone: pickupArea.zoneId.toString() === dropArea.zoneId.toString(),
  };
}
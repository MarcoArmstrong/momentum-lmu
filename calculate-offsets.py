#!/usr/bin/env python3
"""
Calculate byte offsets for rF2 telemetry data structure
Based on pyRfactor2SharedMemory library
"""

import ctypes
import struct

# Define the structures based on pyRfactor2SharedMemory
class rF2Vec3(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ('x', ctypes.c_double),  # 8 bytes
        ('y', ctypes.c_double),  # 8 bytes  
        ('z', ctypes.c_double),  # 8 bytes
    ]

class rF2Wheel(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ('mSuspensionDeflection', ctypes.c_double),      # 8 bytes
        ('mRideHeight', ctypes.c_double),                # 8 bytes
        ('mSuspForce', ctypes.c_double),                 # 8 bytes
        ('mBrakeTemp', ctypes.c_double),                 # 8 bytes
        ('mBrakePressure', ctypes.c_double),             # 8 bytes
        ('mRotation', ctypes.c_double),                  # 8 bytes
        ('mLateralPatchVel', ctypes.c_double),           # 8 bytes
        ('mLongitudinalPatchVel', ctypes.c_double),      # 8 bytes
        ('mLateralGroundVel', ctypes.c_double),          # 8 bytes
        ('mLongitudinalGroundVel', ctypes.c_double),     # 8 bytes
        ('mCamber', ctypes.c_double),                    # 8 bytes
        ('mLateralForce', ctypes.c_double),              # 8 bytes
        ('mLongitudinalForce', ctypes.c_double),         # 8 bytes
        ('mTireLoad', ctypes.c_double),                  # 8 bytes
        ('mGripFract', ctypes.c_double),                 # 8 bytes
        ('mPressure', ctypes.c_double),                  # 8 bytes
        ('mTemperature', ctypes.c_double * 3),           # 24 bytes
        ('mWear', ctypes.c_double),                      # 8 bytes
        ('mTerrainName', ctypes.c_ubyte * 16),           # 16 bytes
        ('mSurfaceType', ctypes.c_ubyte),                # 1 byte
        ('mFlat', ctypes.c_ubyte),                       # 1 byte
        ('mDetached', ctypes.c_ubyte),                   # 1 byte
        ('mStaticUndeflectedRadius', ctypes.c_ubyte),    # 1 byte
        ('mVerticalTireDeflection', ctypes.c_double),    # 8 bytes
        ('mWheelYLocation', ctypes.c_double),            # 8 bytes
        ('mToe', ctypes.c_double),                       # 8 bytes
        ('mTireCarcassTemperature', ctypes.c_double),    # 8 bytes
        ('mTireInnerLayerTemperature', ctypes.c_double * 3), # 24 bytes
        ('mExpansion', ctypes.c_ubyte * 24),             # 24 bytes
    ]

def calculate_telemetry_offsets():
    """Calculate offsets for the rF2VehicleTelemetry structure"""
    
    # Start with the fields we know
    offset = 0
    
    # mID (int32) - 4 bytes
    mID_offset = offset
    offset += 4
    
    # mDeltaTime (double) - 8 bytes
    mDeltaTime_offset = offset
    offset += 8
    
    # mElapsedTime (double) - 8 bytes
    mElapsedTime_offset = offset
    offset += 8
    
    # mLapNumber (int32) - 4 bytes
    mLapNumber_offset = offset
    offset += 4
    
    # mLapStartET (double) - 8 bytes
    mLapStartET_offset = offset
    offset += 8
    
    # mVehicleName (ubyte[64]) - 64 bytes
    mVehicleName_offset = offset
    offset += 64
    
    # mTrackName (ubyte[64]) - 64 bytes
    mTrackName_offset = offset
    offset += 64
    
    # mPos (rF2Vec3) - 24 bytes
    mPos_offset = offset
    offset += 24
    
    # mLocalVel (rF2Vec3) - 24 bytes - THIS IS SPEED!
    mLocalVel_offset = offset
    offset += 24
    
    # mLocalAccel (rF2Vec3) - 24 bytes
    mLocalAccel_offset = offset
    offset += 24
    
    # mOri (rF2Vec3[3]) - 72 bytes
    mOri_offset = offset
    offset += 72
    
    # mLocalRot (rF2Vec3) - 24 bytes
    mLocalRot_offset = offset
    offset += 24
    
    # mLocalRotAccel (rF2Vec3) - 24 bytes
    mLocalRotAccel_offset = offset
    offset += 24
    
    # mGear (int32) - 4 bytes - THIS IS GEAR!
    mGear_offset = offset
    offset += 4
    
    # mEngineRPM (double) - 8 bytes - THIS IS RPM!
    mEngineRPM_offset = offset
    offset += 8
    
    # mEngineWaterTemp (double) - 8 bytes
    mEngineWaterTemp_offset = offset
    offset += 8
    
    # mEngineOilTemp (double) - 8 bytes
    mEngineOilTemp_offset = offset
    offset += 8
    
    # mClutchRPM (double) - 8 bytes
    mClutchRPM_offset = offset
    offset += 8
    
    # mUnfilteredThrottle (double) - 8 bytes
    mUnfilteredThrottle_offset = offset
    offset += 8
    
    # mUnfilteredBrake (double) - 8 bytes
    mUnfilteredBrake_offset = offset
    offset += 8
    
    # mUnfilteredSteering (double) - 8 bytes
    mUnfilteredSteering_offset = offset
    offset += 8
    
    # mUnfilteredClutch (double) - 8 bytes
    mUnfilteredClutch_offset = offset
    offset += 8
    
    # mFilteredThrottle (double) - 8 bytes
    mFilteredThrottle_offset = offset
    offset += 8
    
    # mFilteredBrake (double) - 8 bytes
    mFilteredBrake_offset = offset
    offset += 8
    
    # mFilteredSteering (double) - 8 bytes
    mFilteredSteering_offset = offset
    offset += 8
    
    # mFilteredClutch (double) - 8 bytes
    mFilteredClutch_offset = offset
    offset += 8
    
    # mSteeringShaftTorque (double) - 8 bytes
    mSteeringShaftTorque_offset = offset
    offset += 8
    
    # mFront3rdDeflection (double) - 8 bytes
    mFront3rdDeflection_offset = offset
    offset += 8
    
    # mRear3rdDeflection (double) - 8 bytes
    mRear3rdDeflection_offset = offset
    offset += 8
    
    # mFrontWingHeight (double) - 8 bytes
    mFrontWingHeight_offset = offset
    offset += 8
    
    # mFrontRideHeight (double) - 8 bytes
    mFrontRideHeight_offset = offset
    offset += 8
    
    # mRearRideHeight (double) - 8 bytes
    mRearRideHeight_offset = offset
    offset += 8
    
    # mDrag (double) - 8 bytes
    mDrag_offset = offset
    offset += 8
    
    # mFrontDownforce (double) - 8 bytes
    mFrontDownforce_offset = offset
    offset += 8
    
    # mRearDownforce (double) - 8 bytes
    mRearDownforce_offset = offset
    offset += 8
    
    # mFuel (double) - 8 bytes
    mFuel_offset = offset
    offset += 8
    
    # mEngineMaxRPM (double) - 8 bytes - THIS IS MAX RPM!
    mEngineMaxRPM_offset = offset
    offset += 8
    
    print("=== rF2 Telemetry Data Structure Offsets ===")
    print(f"mID (int32): 0x{mID_offset:04x}")
    print(f"mDeltaTime (double): 0x{mDeltaTime_offset:04x}")
    print(f"mElapsedTime (double): 0x{mElapsedTime_offset:04x}")
    print(f"mLapNumber (int32): 0x{mLapNumber_offset:04x}")
    print(f"mLapStartET (double): 0x{mLapStartET_offset:04x}")
    print(f"mVehicleName (string[64]): 0x{mVehicleName_offset:04x}")
    print(f"mTrackName (string[64]): 0x{mTrackName_offset:04x}")
    print(f"mPos (rF2Vec3): 0x{mPos_offset:04x}")
    print(f"mLocalVel (rF2Vec3) - SPEED: 0x{mLocalVel_offset:04x}")
    print(f"mLocalAccel (rF2Vec3): 0x{mLocalAccel_offset:04x}")
    print(f"mOri (rF2Vec3[3]): 0x{mOri_offset:04x}")
    print(f"mLocalRot (rF2Vec3): 0x{mLocalRot_offset:04x}")
    print(f"mLocalRotAccel (rF2Vec3): 0x{mLocalRotAccel_offset:04x}")
    print(f"mGear (int32) - GEAR: 0x{mGear_offset:04x}")
    print(f"mEngineRPM (double) - RPM: 0x{mEngineRPM_offset:04x}")
    print(f"mEngineWaterTemp (double): 0x{mEngineWaterTemp_offset:04x}")
    print(f"mEngineOilTemp (double): 0x{mEngineOilTemp_offset:04x}")
    print(f"mClutchRPM (double): 0x{mClutchRPM_offset:04x}")
    print(f"mUnfilteredThrottle (double): 0x{mUnfilteredThrottle_offset:04x}")
    print(f"mUnfilteredBrake (double): 0x{mUnfilteredBrake_offset:04x}")
    print(f"mUnfilteredSteering (double): 0x{mUnfilteredSteering_offset:04x}")
    print(f"mUnfilteredClutch (double): 0x{mUnfilteredClutch_offset:04x}")
    print(f"mFilteredThrottle (double): 0x{mFilteredThrottle_offset:04x}")
    print(f"mFilteredBrake (double): 0x{mFilteredBrake_offset:04x}")
    print(f"mFilteredSteering (double): 0x{mFilteredSteering_offset:04x}")
    print(f"mFilteredClutch (double): 0x{mFilteredClutch_offset:04x}")
    print(f"mSteeringShaftTorque (double): 0x{mSteeringShaftTorque_offset:04x}")
    print(f"mFront3rdDeflection (double): 0x{mFront3rdDeflection_offset:04x}")
    print(f"mRear3rdDeflection (double): 0x{mRear3rdDeflection_offset:04x}")
    print(f"mFrontWingHeight (double): 0x{mFrontWingHeight_offset:04x}")
    print(f"mFrontRideHeight (double): 0x{mFrontRideHeight_offset:04x}")
    print(f"mRearRideHeight (double): 0x{mRearRideHeight_offset:04x}")
    print(f"mDrag (double): 0x{mDrag_offset:04x}")
    print(f"mFrontDownforce (double): 0x{mFrontDownforce_offset:04x}")
    print(f"mRearDownforce (double): 0x{mRearDownforce_offset:04x}")
    print(f"mFuel (double): 0x{mFuel_offset:04x}")
    print(f"mEngineMaxRPM (double) - MAX RPM: 0x{mEngineMaxRPM_offset:04x}")
    
    print("\n=== KEY FIELDS FOR OUR APPLICATION ===")
    print(f"GEAR (mGear): 0x{mGear_offset:04x} (int32)")
    print(f"RPM (mEngineRPM): 0x{mEngineRPM_offset:04x} (double)")
    print(f"MAX RPM (mEngineMaxRPM): 0x{mEngineMaxRPM_offset:04x} (double)")
    print(f"SPEED (mLocalVel.x): 0x{mLocalVel_offset:04x} (double - x component)")
    print(f"SPEED (mLocalVel.y): 0x{mLocalVel_offset + 8:04x} (double - y component)")
    print(f"SPEED (mLocalVel.z): 0x{mLocalVel_offset + 16:04x} (double - z component)")
    
    # Calculate speed magnitude (sqrt(x² + y² + z²))
    print(f"\n=== SPEED CALCULATION ===")
    print("Speed should be calculated as: sqrt(mLocalVel.x² + mLocalVel.y² + mLocalVel.z²)")
    print("Or use mLocalVel.x for forward speed (most common)")

if __name__ == "__main__":
    calculate_telemetry_offsets()

#!/usr/bin/env python3

"""
Calculate offsets for rF2VehicleTelemetry structure based on pyRfactor2SharedMemory
"""

import ctypes

# Define the structures based on pyRfactor2SharedMemory
class rF2Vec3(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ('x', ctypes.c_double),
        ('y', ctypes.c_double), 
        ('z', ctypes.c_double),
    ]

class rF2VehicleTelemetry(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ('mID', ctypes.c_int),                                              # slot ID
        ('mDeltaTime', ctypes.c_double),                                    # time since last update (seconds)
        ('mElapsedTime', ctypes.c_double),                                  # game session time
        ('mLapNumber', ctypes.c_int),                                       # current lap number
        ('mLapStartET', ctypes.c_double),                                   # time this lap was started
        ('mVehicleName', ctypes.c_ubyte*64),                                # current vehicle name
        ('mTrackName', ctypes.c_ubyte*64),                                  # current track name
        ('mPos', rF2Vec3),                                                  # world position in meters
        ('mLocalVel', rF2Vec3),                                             # velocity (meters/sec) in local vehicle coordinates
        ('mLocalAccel', rF2Vec3),                                           # acceleration (meters/sec^2) in local vehicle coordinates
        ('mOri', rF2Vec3*3),                                                # rows of orientation matrix
        ('mLocalRot', rF2Vec3),                                             # rotation (radians/sec) in local vehicle coordinates
        ('mLocalRotAccel', rF2Vec3),                                        # rotational acceleration (radians/sec^2) in local vehicle coordinates
        ('mGear', ctypes.c_int),                                            # -1=reverse, 0=neutral, 1+ = forward gears
        ('mEngineRPM', ctypes.c_double),                                    # engine RPM
        ('mEngineWaterTemp', ctypes.c_double),                              # Celsius
        ('mEngineOilTemp', ctypes.c_double),                                # Celsius
        ('mClutchRPM', ctypes.c_double),                                    # clutch RPM
        ('mUnfilteredThrottle', ctypes.c_double),                           # ranges  0.0-1.0
        ('mUnfilteredBrake', ctypes.c_double),                              # ranges  0.0-1.0
        ('mUnfilteredSteering', ctypes.c_double),                           # ranges -1.0-1.0 (left to right)
        ('mUnfilteredClutch', ctypes.c_double),                             # ranges  0.0-1.0
        ('mFilteredThrottle', ctypes.c_double),                             # ranges  0.0-1.0
        ('mFilteredBrake', ctypes.c_double),                                # ranges  0.0-1.0
        ('mFilteredSteering', ctypes.c_double),                             # ranges -1.0-1.0 (left to right)
        ('mFilteredClutch', ctypes.c_double),                               # ranges  0.0-1.0
        ('mSteeringShaftTorque', ctypes.c_double),                          # torque around steering shaft
        ('mFront3rdDeflection', ctypes.c_double),                           # deflection at front 3rd spring
        ('mRear3rdDeflection', ctypes.c_double),                            # deflection at rear 3rd spring
        ('mFrontWingHeight', ctypes.c_double),                              # front wing height
        ('mFrontRideHeight', ctypes.c_double),                              # front ride height
        ('mRearRideHeight', ctypes.c_double),                               # rear ride height
        ('mDrag', ctypes.c_double),                                         # drag
        ('mFrontDownforce', ctypes.c_double),                               # front downforce
        ('mRearDownforce', ctypes.c_double),                                # rear downforce
        ('mFuel', ctypes.c_double),                                         # amount of fuel (liters)
        ('mEngineMaxRPM', ctypes.c_double),                                 # rev limit
        ('mScheduledStops', ctypes.c_ubyte),                                # number of scheduled pitstops
        ('mOverheating', ctypes.c_ubyte),                                   # whether overheating icon is shown
        ('mDetached', ctypes.c_ubyte),                                      # whether any parts (besides wheels) have been detached
        ('mHeadlights', ctypes.c_ubyte),                                    # whether headlights are on
        ('mDentSeverity', ctypes.c_ubyte*8),                                # dent severity at 8 locations around the car
        ('mLastImpactET', ctypes.c_double),                                 # time of last impact
        ('mLastImpactMagnitude', ctypes.c_double),                          # magnitude of last impact
        ('mLastImpactPos', rF2Vec3),                                        # location of last impact
        ('mEngineTorque', ctypes.c_double),                                 # current engine torque
        ('mCurrentSector', ctypes.c_int),                                   # the current sector
        ('mSpeedLimiter', ctypes.c_ubyte),                                  # whether speed limiter is on
        ('mMaxGears', ctypes.c_ubyte),                                      # maximum forward gears
        ('mFrontTireCompoundIndex', ctypes.c_ubyte),                        # index within brand
        ('mRearTireCompoundIndex', ctypes.c_ubyte),                         # index within brand
        ('mFuelCapacity', ctypes.c_double),                                 # capacity in liters
        ('mFrontFlapActivated', ctypes.c_ubyte),                            # whether front flap is activated
        ('mRearFlapActivated', ctypes.c_ubyte),                             # whether rear flap is activated
        ('mRearFlapLegalStatus', ctypes.c_ubyte),                           # 0=disallowed, 1=criteria detected but not allowed quite yet, 2 = allowed
        ('mIgnitionStarter', ctypes.c_ubyte),                               # 0=off 1=ignition 2 = ignition+starter
        ('mFrontTireCompoundName', ctypes.c_ubyte*18),                      # name of front tire compound
        ('mRearTireCompoundName', ctypes.c_ubyte*18),                       # name of rear tire compound
        ('mSpeedLimiterAvailable', ctypes.c_ubyte),                         # whether speed limiter is available
        ('mAntiStallActivated', ctypes.c_ubyte),                            # whether (hard) anti-stall is activated
        ('mUnused', ctypes.c_ubyte*2),                                      #
        ('mVisualSteeringWheelRange', ctypes.c_float),                      # the *visual* steering wheel range
        ('mRearBrakeBias', ctypes.c_double),                                # fraction of brakes on rear
        ('mTurboBoostPressure', ctypes.c_double),                           # current turbo boost pressure if available
        ('mPhysicsToGraphicsOffset', ctypes.c_float*3),                     # offset from static CG to graphical center
        ('mPhysicalSteeringWheelRange', ctypes.c_float),                    # the *physical* steering wheel range
        ('mExpansion', ctypes.c_ubyte*152),                                 # for future use
        # ('mWheels', rF2Wheel*4),                                          # wheel info (front left, front right, rear left, rear right)
    ]

def get_field_offset(structure_class, field_name):
    """Get the offset of a field in a structure"""
    return getattr(structure_class, field_name).offset

def main():
    print("🎯 Calculating offsets for rF2VehicleTelemetry structure")
    print("=" * 60)
    
    # Create an instance to get the structure size
    instance = rF2VehicleTelemetry()
    print(f"Structure size: {ctypes.sizeof(instance)} bytes")
    print()
    
    # Calculate offsets for key fields
    fields_to_check = [
        'mID',
        'mDeltaTime', 
        'mElapsedTime',
        'mLapNumber',
        'mLapStartET',
        'mVehicleName',
        'mTrackName',
        'mPos',
        'mLocalVel',
        'mLocalAccel',
        'mOri',
        'mLocalRot',
        'mLocalRotAccel',
        'mGear',
        'mEngineRPM',
        'mEngineMaxRPM',
        'mFuel',
        'mUnfilteredThrottle',
        'mUnfilteredBrake',
        'mUnfilteredSteering',
        'mUnfilteredClutch',
    ]
    
    print("📊 Field Offsets:")
    print("-" * 40)
    
    for field_name in fields_to_check:
        try:
            offset = get_field_offset(rF2VehicleTelemetry, field_name)
            field_type = getattr(rF2VehicleTelemetry, field_name).size
            print(f"  {field_name:20} -> 0x{offset:04x} ({offset:4d}) - {field_type} bytes")
        except AttributeError:
            print(f"  {field_name:20} -> NOT FOUND")
    
    print()
    print("🎯 Key Offsets for our app:")
    print("-" * 40)
    print(f"  Gear (mGear):          0x{get_field_offset(rF2VehicleTelemetry, 'mGear'):04x}")
    print(f"  RPM (mEngineRPM):      0x{get_field_offset(rF2VehicleTelemetry, 'mEngineRPM'):04x}")
    print(f"  Max RPM (mEngineMaxRPM): 0x{get_field_offset(rF2VehicleTelemetry, 'mEngineMaxRPM'):04x}")
    print(f"  Speed (mLocalVel):     0x{get_field_offset(rF2VehicleTelemetry, 'mLocalVel'):04x}")
    print(f"  Throttle:              0x{get_field_offset(rF2VehicleTelemetry, 'mUnfilteredThrottle'):04x}")
    print(f"  Brake:                 0x{get_field_offset(rF2VehicleTelemetry, 'mUnfilteredBrake'):04x}")
    print(f"  Steering:              0x{get_field_offset(rF2VehicleTelemetry, 'mUnfilteredSteering'):04x}")
    print(f"  Clutch:                0x{get_field_offset(rF2VehicleTelemetry, 'mUnfilteredClutch'):04x}")
    print(f"  Fuel:                  0x{get_field_offset(rF2VehicleTelemetry, 'mFuel'):04x}")
    
    print()
    print("💡 Speed calculation:")
    print("   Speed = sqrt(mLocalVel.x² + mLocalVel.y² + mLocalVel.z²)")
    print("   mLocalVel.x = 0x{:04x}".format(get_field_offset(rF2VehicleTelemetry, 'mLocalVel')))
    print("   mLocalVel.y = 0x{:04x}".format(get_field_offset(rF2VehicleTelemetry, 'mLocalVel') + 8))
    print("   mLocalVel.z = 0x{:04x}".format(get_field_offset(rF2VehicleTelemetry, 'mLocalVel') + 16))

if __name__ == "__main__":
    main()

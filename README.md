# Barbara temperature sensor

## Installation

Install dtc

```sh
# wget -c https://raw.github.com/RobertCNelson/tools/master/pkgs/dtc.sh
# chmod +x dtc.sh
# ./dtc.sh
```

Install cape overlay for temperature sensor (from the src directory of this repo)

```sh
# dtc -O dtb -o BB-1WIRE-P9-22-00A0.dtbo -b o -@ BB-1WIRE-P9-22-00A0.dts
# cp BB-1WIRE-P9-22-00A0.dtbo /lib/firmware/
```

Apply the overlay

```sh
# export SLOTS=/sys/devices/bone_capemgr.*/slots
# echo BB-1WIRE-P9-22 > $SLOTS
```

Check that it's been loaded

```sh
# cat $SLOTS
 0: 54:PF---
 1: 55:PF---
 2: 56:PF---
 3: 57:PF---
 4: ff:P-O-L Bone-LT-eMMC-2G,00A0,Texas Instrument,BB-BONE-EMMC-2G
 5: ff:P-O-L Bone-Black-HDMI,00A0,Texas Instrument,BB-BONELT-HDMI
11: ff:P-O-L Override Board Name,00A0,Override Manuf,BB-1WIRE-P9-22
```

Attach DS18B20 data pin to `P9.22`, VCC to 3.3v and ground to ground.

Check that it's working (device id will vary):

```sh
# cat /sys/bus/w1/devices/28-000004027af4/w1_slave
25 01 4b 46 7f ff 0b 10 65 : crc=65 YES
25 01 4b 46 7f ff 0b 10 65 t=18312
```

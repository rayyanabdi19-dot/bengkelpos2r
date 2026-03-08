// Web Bluetooth API type declarations
declare global {
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    properties: BluetoothCharacteristicProperties;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }

  interface BluetoothCharacteristicProperties {
    write: boolean;
    writeWithoutResponse: boolean;
  }

  interface Bluetooth {
    requestDevice(options: {
      filters?: Array<{ services?: string[]; namePrefix?: string; name?: string }>;
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }): Promise<BluetoothDevice>;
  }

  interface Navigator {
    bluetooth: Bluetooth;
  }
}

export {};

/**
 * Tauri IPC Command Test Utilities
 * Phase 12: Backend integration testing
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Test greet command
 */
export async function testGreet(name: string): Promise<string> {
  try {
    const result = await invoke<string>('greet', { name });
    console.log('✅ greet command succeeded:', result);
    return result;
  } catch (error) {
    console.error('❌ greet command failed:', error);
    throw error;
  }
}

/**
 * Test FileManager commands
 */
export async function testFileManager() {
  console.group('📁 FileManager Tests');
  
  try {
    // Test scan_directory
    const scanResult = await invoke('file_manager_scan_directory', { 
      path: '.' 
    });
    console.log('✅ scan_directory:', scanResult);

    // Test get_storage_stats
    const statsResult = await invoke('file_manager_get_storage_stats');
    console.log('✅ get_storage_stats:', statsResult);

    console.log('✅ All FileManager tests passed');
  } catch (error) {
    console.error('❌ FileManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test NetworkManager commands
 */
export async function testNetworkManager() {
  console.group('🌐 NetworkManager Tests');
  
  try {
    // Test get_network_stats
    const statsResult = await invoke('network_manager_get_network_stats');
    console.log('✅ get_network_stats:', statsResult);

    console.log('✅ All NetworkManager tests passed');
  } catch (error) {
    console.error('❌ NetworkManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test IoTManager commands
 */
export async function testIoTManager() {
  console.group('🏠 IoTManager Tests');
  
  try {
    // Test initialize
    const initResult = await invoke('iot_manager_initialize');
    console.log('✅ initialize:', initResult);

    // Test get_device_status (requires deviceId - get from initialize first)
    const devices = await invoke('iot_manager_initialize');
    if (Array.isArray(devices) && devices.length > 0) {
      const statusResult = await invoke('iot_manager_get_device_status', {
        deviceId: devices[0].id
      });
      console.log('✅ get_device_status:', statusResult);
    } else {
      console.log('ℹ️ No devices to test get_device_status');
    }

    console.log('✅ All IoTManager tests passed');
  } catch (error) {
    console.error('❌ IoTManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test ScheduleManager commands
 */
export async function testScheduleManager() {
  console.group('📅 ScheduleManager Tests');
  
  try {
    // Test get_upcoming_schedules
    const schedules = await invoke('schedule_manager_get_upcoming_schedules', {
      days: 7
    });
    console.log('✅ get_upcoming_schedules:', schedules);

    console.log('✅ All ScheduleManager tests passed');
  } catch (error) {
    console.error('❌ ScheduleManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test FinanceManager commands
 */
export async function testFinanceManager() {
  console.group('💰 FinanceManager Tests');
  
  try {
    // Test get_budgets
    const budgets = await invoke('finance_manager_get_budgets');
    console.log('✅ get_budgets:', budgets);

    console.log('✅ All FinanceManager tests passed');
  } catch (error) {
    console.error('❌ FinanceManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test AssetManager commands
 */
export async function testAssetManager() {
  console.group('📦 AssetManager Tests');
  
  try {
    // Test count_assets
    const count = await invoke('asset_manager_count_assets');
    console.log('✅ count_assets:', count);

    // Test get_all_assets
    const assets = await invoke('asset_manager_get_all_assets');
    console.log('✅ get_all_assets:', assets);

    console.log('✅ All AssetManager tests passed');
  } catch (error) {
    console.error('❌ AssetManager test failed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Run all IPC tests
 */
export async function runAllTests() {
  console.log('🚀 Starting Tauri IPC Tests...\n');

  await testGreet('Tauri');
  await testFileManager();
  await testNetworkManager();
  await testIoTManager();
  await testScheduleManager();
  await testFinanceManager();
  await testAssetManager();

  console.log('\n✅ All Tauri IPC tests completed!');
}

// Make test functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).tauriTest = {
    runAllTests,
    testGreet,
    testFileManager,
    testNetworkManager,
    testIoTManager,
    testScheduleManager,
    testFinanceManager,
    testAssetManager,
  };

  console.log('💡 Tauri test utilities loaded. Use window.tauriTest.runAllTests() to test all commands.');
}

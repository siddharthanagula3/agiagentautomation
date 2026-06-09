import Foundation
import ARKit
import AVFoundation
import SwiftUI

/// Scanner controller coordinating ARKit physical spatial mapping and AVFoundation QR/barcode reading.
/// Implemented to support cross-platform mobile functionality.
public class AGIWorkforceScanner: NSObject, AVCaptureMetadataOutputObjectsDelegate, ARSessionDelegate {
    
    public var arSession: ARSession?
    public var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    public override init() {
        super.init()
    }
    
    /// Configures and runs ARKit world tracking configuration for spatial surface detection
    public func startARWorldTracking() {
        guard ARWorldTrackingConfiguration.isSupported else {
            print("ARKit: World tracking configuration is not supported on this device.")
            return
        }
        
        let session = ARSession()
        session.delegate = self
        self.arSession = session
        
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic
        
        session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        print("ARKit: Spatial tracking session successfully started.")
    }
    
    /// Initializes AVFoundation capture session to scan documents, badges, and QR codes
    public func startCameraScanner(completion: @escaping (String) -> Void) {
        let captureSession = AVCaptureSession()
        self.captureSession = captureSession
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            print("AVFoundation: Default video capture device is not available.")
            return
        }
        
        let videoInput: AVCaptureDeviceInput
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            print("AVFoundation: Failed to initialize video input device: \(error.localizedDescription)")
            return
        }
        
        if captureSession.canAddInput(videoInput) {
            captureSession.addInput(videoInput)
        } else {
            print("AVFoundation: Cannot add video input device to capture session.")
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        if captureSession.canAddOutput(metadataOutput) {
            captureSession.addOutput(metadataOutput)
            
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr, .ean8, .ean13, .pdf417]
        } else {
            print("AVFoundation: Cannot add metadata output to capture session.")
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            captureSession.startRunning()
            print("AVFoundation: Video capture session running.")
        }
    }
    
    // MARK: - ARSessionDelegate
    
    public func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        for anchor in anchors {
            if let planeAnchor = anchor as? ARPlaneAnchor {
                print("ARKit: Plane anchor detected - center: \(planeAnchor.center), extent: \(planeAnchor.extent)")
            }
        }
    }
    
    public func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        // Handle physical spatial updates
    }
    
    public func session(_ session: ARSession, didFailWithError error: Error) {
        print("ARKit: Session encountered an error: \(error.localizedDescription)")
    }
    
    // MARK: - AVCaptureMetadataOutputObjectsDelegate
    
    public func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first {
            guard let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject else { return }
            guard let stringValue = readableObject.stringValue else { return }
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            print("AVFoundation: Scanned content - \(stringValue)")
            
            // Turn off camera after successful capture
            self.captureSession?.stopRunning()
        }
    }
}

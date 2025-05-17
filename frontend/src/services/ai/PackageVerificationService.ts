// src/services/ai/PackageVerificationService.ts
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export class PackageVerificationService {
  private model: any = null;
  private modelLoading: boolean = false;
  
  constructor() {
    this.initModel();
  }
  
  private async initModel() {
    if (this.model || this.modelLoading) return;
    
    try {
      this.modelLoading = true;
      console.log("Loading MobileNet model...");
      this.model = await mobilenet.load();
      console.log("MobileNet model loaded successfully");
    } catch (error) {
      console.error("Failed to load MobileNet model:", error);
    } finally {
      this.modelLoading = false;
    }
  }
  
  // This method will convert an image URL to an HTML Image element
  private async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Needed for CORS
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = imageUrl;
    });
  }
  
  async verifyPackageImages(
    pickupImageUrl: string,
    deliveryImageUrl: string
  ): Promise<{
    isMatch: boolean;
    confidence: number;
    conditionChange: 'none' | 'minor' | 'significant';
    notes: string[];
  }> {
    if (!this.model) {
      await this.initModel();
    }
    
    if (!this.model) {
      throw new Error("Model failed to load");
    }
    
    try {
      // Load the images
      const pickupImg = await this.loadImage(pickupImageUrl);
      const deliveryImg = await this.loadImage(deliveryImageUrl);
      
      // Classify the images
      const pickupPrediction = await this.model.classify(pickupImg);
      const deliveryPrediction = await this.model.classify(deliveryImg);
      
      console.log("Pickup predictions:", pickupPrediction);
      console.log("Delivery predictions:", deliveryPrediction);
      
      // Compare the predictions
      const matchScore = this.calculateMatchScore(pickupPrediction, deliveryPrediction);
      
      // Determine condition change
      const conditionChange = this.determineConditionChange(matchScore);
      
      // Generate explanation notes
      const notes = this.generateNotes(pickupPrediction, deliveryPrediction, matchScore);
      
      return {
        isMatch: matchScore > 0.6, // Consider it a match if score > 0.6
        confidence: matchScore,
        conditionChange,
        notes
      };
    } catch (error) {
      console.error("Image verification error:", error);
      return {
        isMatch: false,
        confidence: 0,
        conditionChange: 'significant',
        notes: ['Automated verification failed. Manual review required.']
      };
    }
  }
  
  private calculateMatchScore(pickupPred: any[], deliveryPred: any[]): number {
    // Calculate a similarity score between the two prediction sets
    let score = 0;
    
    // Check for common classes in top predictions
    for (const pickup of pickupPred) {
      for (const delivery of deliveryPred) {
        if (pickup.className === delivery.className) {
          // Add to score based on the product of probabilities
          score += pickup.probability * delivery.probability;
        }
      }
    }
    
    // Normalize score (0 to 1)
    return Math.min(score, 1);
  }
  
  private determineConditionChange(matchScore: number): 'none' | 'minor' | 'significant' {
    if (matchScore > 0.8) return 'none';
    if (matchScore > 0.4) return 'minor';
    return 'significant';
  }
  
  private generateNotes(pickupPred: any[], deliveryPred: any[], matchScore: number): string[] {
    const notes = [];
    
    if (matchScore < 0.4) {
      notes.push("Significant differences detected between pickup and delivery images.");
    } else if (matchScore < 0.8) {
      notes.push("Minor differences detected between pickup and delivery images.");
    } else {
      notes.push("Pickup and delivery images appear to show the same package.");
    }
    
    // Add details about what's in the images
    notes.push(`Pickup image appears to show: ${pickupPred[0].className} (${Math.round(pickupPred[0].probability * 100)}% confidence)`);
    notes.push(`Delivery image appears to show: ${deliveryPred[0].className} (${Math.round(deliveryPred[0].probability * 100)}% confidence)`);
    
    return notes;
  }
}
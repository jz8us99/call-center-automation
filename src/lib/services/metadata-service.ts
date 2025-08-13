import { NextResponse } from 'next/server';
import {
  MetaDataRequest,
  MetaDataResponse,
  ErrorResponse,
  RetellFunctionResponse,
} from '@/types/clinic';

/**
 * MetaData service for handling clinic metadata operations
 */
export class MetaDataService {
  private userId: string;
  private agentId: string;

  constructor(userId: string, agentId: string) {
    this.userId = userId;
    this.agentId = agentId;
  }

  /**
   * Get clinic metadata
   */
  async getMetaData(
    _args?: MetaDataRequest
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    try {
      // For now, return fixed mock data for the dental clinic
      // In the future, this can be extended to fetch data based on userId and agentId
      const metaData: MetaDataResponse = {
        practice_name: 'Dentistry by Dr. Fei Test',
        location: '3209 South Brea Canyon Road Suite F, Diamond Bar, CA 91765',
        phone: '909-240-1784',
        email: 'dentistrybydrdoshi@gmail.com',
        team: [
          'Dr. Fei Test',
          'Dr. Sanjay Doshi',
          'Dr. Tammam Sheabar',
          'Dr. Adrien Hamedi',
          'Dr. Louie Al-Faraje',
          'Dr. Kurt Bryant',
          'Dr. Austin Burnett',
          'Dr. Salman Hussain',
          'Dr. Jenny Ha',
        ],
        services: [
          'Comprehensive general and cosmetic dentistry',
          'Endodontics',
          'Oral surgery',
          'Porcelain veneers',
          'Dental implants',
          'Crowns',
          'Bridges',
          'Teeth whitening',
          'Inlays and onlays',
          'Dental bonding',
          'Teeth veneers',
          'Implant-retained dentures',
          'Gum disease laser therapy',
        ],
        hours: [
          'Monday: 9:00 AM to 5:30 PM PDT',
          'Tuesday: 9:00 AM to 5:30 PM PDT',
          'Wednesday: 9:00 AM to 5:30 PM PDT',
          'Thursday: 9:00 AM to 5:30 PM PDT',
          'Friday: 9:00 AM to 5:30 PM PDT',
          'Saturday: 9:00 AM to 2:30 PM PDT (by appointment only)',
          'Sunday: Closed',
        ],
        insurance: [
          'Aetna',
          'Aflac',
          'AlwaysCare',
          'Ameritas',
          'Anthem Blue Cross Blue Shield',
          'Blue Cross Blue Shield of California',
          'Careington International',
          'Cigna Dental',
          'Delta Dental',
          'First Dental Health',
          'Guardian',
          'Humana',
          'Metlife',
          'United Concordia',
        ],
        emergency_info:
          'We handle dental emergencies and can offer advice for immediate relief (like a saltwater rinse or a cold compress) if the office is closed.',
        user_id: this.userId,
        agent_id: this.agentId,
      };

      return NextResponse.json({
        result: metaData,
      });
    } catch (error) {
      console.error('MetaData service error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve metadata' },
        { status: 500 }
      );
    }
  }
}

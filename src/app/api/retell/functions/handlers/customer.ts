import { FunctionContext } from '../types';
import { AppointmentService } from '@/lib/services/appointment-service';

const appointmentService = new AppointmentService();

/**
 * Handle lookup_customer function
 */
export async function handleLookupCustomer(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { phone } = args;

    if (!phone) {
      return {
        success: false,
        message: 'I need your phone number to look up your record.',
      };
    }

    const customer = await appointmentService.lookupCustomer(
      phone,
      context.userId
    );

    if (customer) {
      return {
        success: true,
        customerId: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        email: customer.email,
        message: `Found your record, ${customer.first_name}.`,
      };
    } else {
      return {
        success: false,
        message:
          "I couldn't find a record with that information. Let me create a new profile for you.",
      };
    }
  } catch (error) {
    console.error('Error in lookup_customer:', error);
    return {
      success: false,
      message: 'I had trouble looking up your information. Let me try again.',
    };
  }
}

/**
 * Handle upsert_customer function
 */
export async function handleUpsertCustomer(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { firstName, lastName, phone, email } = args;

    if (!firstName || !lastName || !phone) {
      return {
        success: false,
        message:
          'I need your first name, last name, and phone number to create your profile.',
      };
    }

    const customer = await appointmentService.upsertCustomer(
      {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
      },
      context.userId
    );

    return {
      success: true,
      customerId: customer.id,
      message: `Perfect! I've ${customer.created_at === customer.updated_at ? 'created' : 'updated'} your profile.`,
    };
  } catch (error) {
    console.error('Error in upsert_customer:', error);
    return {
      success: false,
      message: 'I had trouble saving your information. Let me try again.',
    };
  }
}

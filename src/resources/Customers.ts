import type { Client } from '../Client'
import * as Types from '../types'
import {
  CUSTOMERS_RESOURCE,
  SCHEDULES_RESOURCE,
  PaginationParams,
  CARDS_RESOURCE,
} from '../constants'

export class Customers {
  protected client: Client
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Retrieves a customer.
   * @param customerId
   * @returns Promise<ICustomer>
   */
  retrieve(customerId: string): Promise<Types.Customers.ICustomer> {
    return this.client.request<Types.Customers.ICustomer>({
      method: 'get',
      path: `${CUSTOMERS_RESOURCE}/${customerId}`,
    })
  }

  /**
   * Creates a customer.
   * @param customerData
   * @returns Promise<ICustomer>
   */
  create(
    customerData: Types.Customers.IRequest
  ): Promise<Types.Customers.ICustomer> {
    return this.client.request<
      Types.Customers.ICustomer,
      Types.Customers.IRequest
    >({
      method: 'post',
      path: CUSTOMERS_RESOURCE,
      data: customerData,
    })
  }

  /**
   * Updates a customer.
   * @param customerId
   * @param customer the attributes of the customer to update
   * @returns Promise<ICustomer>
   */
  update(
    customerId: string,
    customer: Types.Customers.IRequest
  ): Promise<Types.Customers.ICustomer> {
    return this.client.request<
      Types.Customers.ICustomer,
      Types.Customers.IRequest
    >({
      method: 'patch',
      path: `${CUSTOMERS_RESOURCE}/${customerId}`,
      data: customer,
    })
  }

  /**
   * Deletes a customer.
   * @param customerId
   * @returns Promise<ICustomer>
   */
  destroy(customerId: string): Promise<Types.Customers.ICustomer> {
    return this.client.request<Types.Customers.ICustomer>({
      method: 'delete',
      path: `${CUSTOMERS_RESOURCE}/${customerId}`,
    })
  }

  /**
   * List all customers.
   * @returns Promise<ICustomerList>
   *
   */
  list(params?: PaginationParams): Promise<Types.Customers.ICustomerList> {
    return this.client.request<Types.Customers.ICustomerList>({
      method: 'get',
      path: CUSTOMERS_RESOURCE,
      params,
    })
  }

  /**
   * Deletes a card belonging to the customer.
   * @param customerId
   * @param cardId
   * @return Promise<ICard>
   */
  async destroyCard(customerId: string, cardId: string) {
    return this.client.request<Types.Cards.ICard>({
      method: 'delete',
      path: `${CUSTOMERS_RESOURCE}/${customerId}/${CARDS_RESOURCE}/${cardId}`,
    })
  }

  /**
   * Updates the default card for a customer.
   * @param customerId string
   * @param cardToken string
   * @returns Promise<ICustomer>
   */
  async updateDefaultCard(
    customerId: string,
    cardId: string
  ): Promise<Types.Customers.ICustomer> {
    return this.update(customerId, { default_card: cardId })
  }

  /**
   * Adds a new card to a customer and sets the newly added card as the default.
   * @param customerId string
   * @param cardToken string
   * @returns Promise<ICustomer>
   */
  async addCardAsDefault(
    customerId: string,
    cardToken: string
  ): Promise<Types.Customers.ICustomer> {
    const updatedCustomer = await this.update(customerId, {
      card: cardToken,
    })
    const allCards = updatedCustomer.cards.data
    const newCard = allCards[allCards.length - 1]
    return this.updateDefaultCard(customerId, newCard.id)
  }

  /**
   * List all schedules for a customer.
   * @param customerId
   * @returns Promise<ISchedulesList>
   */
  listSchedules(
    customerId: string,
    params?: PaginationParams
  ): Promise<Types.Schedules.ISchedulesList> {
    return this.client.request<Types.Schedules.ISchedulesList>({
      method: 'get',
      path: `${CUSTOMERS_RESOURCE}/${customerId}/${SCHEDULES_RESOURCE}`,
      params,
    })
  }

  /**
   * Deletes all schedules for a customer.
   * @param customerId
   * @return Promise<IDestroyResponse>
   */
  async destroySchedules(
    customerId: string
  ): Promise<Partial<Types.IDestroyResponse>> {
    const schedules = await this.listSchedules(customerId, {
      order: 'reverse_chronological',
      limit: 50, // use a high limit in the hope of catching all schedules that might still be active
    })

    const activeScheduleIds: Array<string> = schedules?.data
      ?.filter((schedule) => schedule?.active)
      ?.map((schedule) => schedule?.id)

    const deleteSchedulesPromises = activeScheduleIds.map((scheduleId) =>
      this.client.schedules.destroy(scheduleId)
    )

    await Promise.all(deleteSchedulesPromises)

    return {
      deleted: true,
    }
  }
}

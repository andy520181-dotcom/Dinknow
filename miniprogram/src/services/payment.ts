import { callCloudFunction } from './cloud'

/**
 * 创建支付订单
 */
export async function createPayment(data: {
  activityId: string
  amount: number
  title: string
}) {
  const result = await callCloudFunction('createPayment', data)
  return result as {
    paymentParams?: {
      timeStamp: string
      nonceStr: string
      package: string
      signType: string
      paySign: string
    }
    orderId?: string
  }
}

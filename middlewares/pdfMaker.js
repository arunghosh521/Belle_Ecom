function generateOrdersPDF(orderData) {
    return {
       content: [
         { text: 'Order List', style: 'header' },
         {
           table: {
             headerRows: 1,
             widths: ['*', '*', '*', '*', '*', '*'],
             body: [
               ['Order Code', 'Date', 'Payment Method', 'Delivery Status', 'Amount', 'Option'],
               ...orderData.map(order => [
                 order.orderId,
                 order.orderedDate,
                 order.payment,
                 order.orderStatus,
                 `$${order.orderTotal}`,
                 `Order Details: /admin/orderList/orderDetails?id=${order._id}`
               ])
             ]
           }
         }
       ],
       styles: {
         header: {
           fontSize: 18,
           bold: true,
           margin: [0, 0, 0, 10]
         }
       }
    };
   }

   
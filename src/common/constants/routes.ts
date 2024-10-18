// auth routes
export const PATH_SIGN_IN = '/sign-in/:email'
export const PATH_SIGN_UP = '/sign-up'
export const PATH_FORGET_PASSWORD = '/forget-password/:email'

// profile routes
export const PATH_GET_USER_BY_ID = '/userById/:userId'
export const PATH_UPDATE_USER = '/updateUser/:userId'

// category routes
export const PATH_GET_CATEGORY_BY_USER_ID = '/categories/:userId'
export const PATH_CREATE_CATEGORY = '/category/create'
export const PATH_UPDATE_CATEGORY = '/category/:categoryId'
export const PATH_DELETE_CATEGORY = '/category/:categoryId/:userId'

// payment routes
export const PATH_GET_PAYMENT_BY_USER_ID = '/payment/:userId'
export const PATH_CREATE_PAYMENT = '/payment/create'
export const PATH_UPDATE_PAYMENT = '/payment/:paymentId'
export const PATH_DELETE_PAYMENT = '/payment/:paymentId/:userId'
export const PATH_ANALYZE_PAYMENT = '/analyze-payment'
export const PATH_GENERATE_PAYMENT_PDF = '/payment-pdf'

// contact routes
export const PATH_GET_CONTACT_BY_USER_ID = '/contact/:userId'
export const PATH_CREATE_CONTACT = '/contact/create'
export const PATH_UPDATE_CONTACT = '/contact/:contactId'
export const PATH_DELETE_CONTACT = '/contact/:contactId/:userId'

// chat routes
export const PATH_GET_USERS = '/users'
export const PATH_LOAD_INITIAL_MESSAGES = '/load-initial-messages'
export const PATH_SEND_MESSAGES = '/send-message'
export const PATH_GENERATE_PDF = '/generate-pdf'
export const PATH_SENT_PDF_IN_MAIL = '/sent-mail-pdf'
export const PATH_GET_TRANSACTION = '/transaction'
export const PATH_GET_UNREAD_MESSAGES = '/unread-messages/:receiverId'

// auto pay routes
export const PATH_GET_AUTO_PAY = '/get-auto-pay/:userId'
export const PATH_GET_AUTO_PAY_BY_ID = '/get-auto-pay-by-id/:paymentId'
export const PATH_ADD_AUTO_PAY = '/add-auto-pay'
export const PATH_EDIT_AUTO_PAY = '/edit-auto-pay/:paymentId'
export const PATH_DELETE_AUTO_PAY = '/delete-auto-pay/:paymentId/:userId'
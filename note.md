# Notes (what needed to be done)

## Order Page 
- need to be tested after adding sample orders in the database
- it child pages fields are not yet setup fully reason: lack of data in the database

## Product Page
- for product deletion we are only soft deleting the product so in frontend we need to filter out the deleted products. and also need to add a restore functionality for the deleted products.
- search functionality is not working (seems like the api is not responding to the search query param),
- in its child pages we did't introduce the **Product Variants** as we are waiting for that api to be ready.
    - `/app/(page)/products/[shopId]/variants/[productId]/page.js`
        - we need to add edit and view pages for product variants as well.
    - `/app/(page)/products/[shopId]/add/page.js`
    - `/app/(page)/products/[shopId]/inventory/page.js`
    - `/app/(page)/products/[shopId]/edit/[productId]/page.js`
    - `/app/(page)/products/[shopId]/view/[productId]/page.js`
        - in view page we need product statistics(views,total sales, compare of both with previous month) related to that product and shop.


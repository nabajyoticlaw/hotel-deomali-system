function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Hotel Website')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Function to fetch content data from a sheet (placeholder for you to fill)
function getHotelData() {
  // You can link a Google Sheet here to pull dynamic content
  return {
    hotelName: "Grand Plaza Hotel",
    about: "Luxury meets comfort. Experience our world-class amenities.",
    phone: "+91 98765 43210",
    email: "booking@grandplaza.com",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
  };
}
import Header from "@/shared/components/Header";
import BookingForm from "@/features/booking/components/BookingForm";
import Footer from "@/shared/components/Footer";

const BookingPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <BookingForm />
      <Footer />
    </div>
  );
};

export default BookingPage;

import Header from "@/shared/components/Header";
import BookingForm from "@/features/booking/components/BookingForm";
import Footer from "@/shared/components/Footer";

const BookingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="page-brand-bg flex-1">
        <Header />
        <BookingForm />
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;

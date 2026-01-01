using Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookedRoom> BookedRooms => Set<BookedRoom>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoomType>(entity =>
        {
            entity.ToTable("room_types");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Price).HasColumnName("price");
            entity.Property(e => e.BedNumber).HasColumnName("bed_number");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.TypeName).HasColumnName("type_name");
            entity.Property(e => e.AvailableRoomsNumber).HasColumnName("available_rooms_number");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable("bookings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(e => e.CheckInDate).HasColumnName("check_in_date");
            entity.Property(e => e.CheckOutDate).HasColumnName("check_out_date");
            entity.Property(e => e.GuestName).HasColumnName("guest_name");
            entity.Property(e => e.GuestEmail).HasColumnName("guest_email");
            entity.Property(e => e.GuestPhone).HasColumnName("guest_phone");

            entity.HasOne(e => e.RoomType)
                .WithMany()
                .HasForeignKey(e => e.RoomTypeId);

            entity.HasOne(e => e.BookedRoom)
                .WithOne(e => e.Booking)
                .HasForeignKey<BookedRoom>(br => br.BookingId);
        });

        modelBuilder.Entity<BookedRoom>(entity =>
        {
            entity.ToTable("booked_rooms");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(e => e.RoomNumber).HasColumnName("room_number");
            entity.Property(e => e.CheckInDate).HasColumnName("check_in_date");
            entity.Property(e => e.CheckOutDate).HasColumnName("check_out_date");

            entity.HasOne(e => e.RoomType)
                .WithMany()
                .HasForeignKey(e => e.RoomTypeId);
        });
    }
}

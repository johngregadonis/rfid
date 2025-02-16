package com.example.vechicle;

public class Operator {
    private String name;
    private String barangay;
    private String body_number;
    private String address;
    private String balance;

    // Getter and Setter methods for name, contact, and bodyNumber
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBarangay() {
        return barangay;
    }

    public void setBarangay(String contact) {
        this.barangay = barangay;
    }

    public String getBodyNumber() {
        return body_number;
    }

    public void setBodyNumber(String body_number) {
        this.body_number = body_number;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBalance() {
        return balance;
    }

    public void setBalance(String balance) {
        this.balance = balance;
    }


    @Override
    public String toString() {
        return "Operator{" +
                "barangay='" + barangay + '\'' +
                ", address='" + address + '\'' +
                '}';
    }
}
